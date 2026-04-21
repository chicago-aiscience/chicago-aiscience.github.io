# checkpointing_example.py
import os
import sys
import signal
import torch
import torch.nn as nn
from pathlib import Path

CHECKPOINT_PATH = Path("checkpoint.pt")
SAVE_EVERY = 10  # also save every N steps as insurance

# -- 1. Preemption flag --------------------------------------------------------
PREEMPTION_FLAG = dict(flag=False)  # module variable  # 1

# -- 2. A signal handler registered before the training loop -------------------
def set_preemption_flag(signum, frame):
    print(f"Signal {signum} received — will checkpoint and requeue.")
    PREEMPTION_FLAG["flag"] = True  # closes over the module variable

# Checkpoint and requeue helpers
def save_checkpoint(step, model, optimizer):
    torch.save(
        {"model": model.state_dict(), "optimizer": optimizer.state_dict(), "step": step},
        CHECKPOINT_PATH,
    )
    print(f"Checkpoint saved at step {step}")

def requeue():
    job_id = os.environ.get("SLURM_JOB_ID")
    if job_id:
        print(f"Requeueing job {job_id}")
        os.system(f"scontrol requeue {job_id}")
    sys.exit(0)

def main():
    """Main execution flow."""

    # -- 2. A signal handler registered before the training loop ---------------
    signal.signal(signal.SIGUSR2, set_preemption_flag)  # 2

    # Model and optimizer
    model = nn.Linear(16, 1)
    optimizer = torch.optim.SGD(model.parameters(), lr=1e-3)
    start_step = 0

    # Resume checkpoint if one exists
    if CHECKPOINT_PATH.exists():  # 3
        ckpt = torch.load(CHECKPOINT_PATH)
        model.load_state_dict(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start_step = ckpt["step"] + 1
        print(f"Resumed from step {start_step}")

    # Training loop
    for step in range(start_step, 200):
        x = torch.randn(32, 16)
        y = torch.randn(32, 1)
        loss = nn.functional.mse_loss(model(x), y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if step % SAVE_EVERY == 0:  # 4
            save_checkpoint(step, model, optimizer)

        # -- 3. A check at the end of each training step -----------------------
        if PREEMPTION_FLAG["flag"]:  # 5
            save_checkpoint(step, model, optimizer)
            requeue()  # 6

    save_checkpoint(step, model, optimizer)
    print("Training complete.")

if __name__ == "__main__":
    main()