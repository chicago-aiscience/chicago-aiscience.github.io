#!/usr/bin/env python3
"""
Toy GPU training example for SLURM GPU jobs.

This minimal example demonstrates GPU usage and accepts command-line arguments
that match the gpu.sbatch script.

Usage:
    python train.py --epochs 5 --batch-size 64 --outdir results/run_12345
"""

import argparse
from pathlib import Path

import torch
import torch.nn as nn


def main():
    parser = argparse.ArgumentParser(description='Toy GPU training example')
    parser.add_argument('--epochs', type=int, default=5, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=64, help='Batch size')
    parser.add_argument('--outdir', type=str, default='results', help='Output directory')

    args = parser.parse_args()

    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # Create output directory
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    # Simple model
    model = nn.Linear(10, 1).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

    # Synthetic data
    X = torch.randn(args.batch_size, 10).to(device)
    y = torch.randn(args.batch_size, 1).to(device)

    # Training loop
    print(f"Training for {args.epochs} epochs...")
    for epoch in range(args.epochs):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch+1}/{args.epochs}, Loss: {loss.item():.4f}")

    # Save checkpoint
    checkpoint_path = outdir / 'checkpoint.pth'
    torch.save(model.state_dict(), checkpoint_path)
    print(f"Model saved to: {checkpoint_path}")
    print("Done!")


if __name__ == '__main__':
    main()
