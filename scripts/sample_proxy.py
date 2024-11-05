#! /usr/bin/env python3
"""Testing an idea for a sample site proxy. Ambition would be to build WebGPU into the site and use
it first class to run the software. Will likely need to consider security to make truly viable.

Never worked.
"""

import asyncio
import logging
import ssl
from asyncio import StreamReader, StreamWriter

logging.basicConfig(level=logging.DEBUG)

BUFFER_SIZE = 65536
TARGET_HOST = "www.google.com"
TARGET_PORT = 443
LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 8000


async def forward(reader: StreamReader, writer: StreamWriter) -> None:
    try:
        while True:
            data = await reader.read(BUFFER_SIZE)
            if data == b"":
                logging.debug("breaking forward loop")
                break
            logging.debug("forwarding data: %s", len(data))
            writer.write(data)
            await writer.drain()
            logging.debug("wrote data")
    except Exception as e:
        logging.error("error:", e)
    finally:
        writer.close()
        await writer.wait_closed()
        logging.debug("forwarding complete")


async def handle_client(client_reader: StreamReader, client_writer: StreamWriter) -> None:
    try:
        ssl_context: ssl.SSLContext = ssl.create_default_context()
        initial_request = await client_reader.read(BUFFER_SIZE)
        logging.debug("initial request: %s", initial_request)
        server_reader, server_writer = await asyncio.open_connection(
            TARGET_HOST, TARGET_PORT, ssl=ssl_context
        )
        server_writer.write(initial_request)
        await server_writer.drain()
        await asyncio.gather(
            forward(client_reader, server_writer),
            forward(server_reader, client_writer),
        )
        logging.debug("forwarding complete")
    except Exception as e:
        logging.error("error:", e)
    finally:
        client_writer.close()
        server_writer.close()
        await client_writer.wait_closed()
        await server_writer.wait_closed()


async def main() -> None:
    server: asyncio.AbstractServer = await asyncio.start_server(
        handle_client, LISTEN_HOST, LISTEN_PORT
    )
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
