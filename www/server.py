#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
import socket
import struct
import time
from urllib.parse import urlparse, parse_qs

def calculate_crc(data):
    """Calculate the CRC-16/MODBUS of a byte buffer."""
    crc = 0
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return crc

def build_command(cmd_str):
    """Convert a string like 'QPIRI' into the command with CRC and 0x0D."""
    # Known commands (example only; you can extend)
    command_map = {
        "QPIRI": [0x51, 0x50, 0x49, 0x52, 0x49],
        "QMOD": [0x51, 0x4D, 0x4F, 0x44],
        "QPI": [0x51, 0x50, 0x49],
        # Add more as needed
    }
    
    if cmd_str in command_map:
        data = bytearray(command_map[cmd_str])
    else:
        # If not a predefined command, try interpreting as hex
        # E.g., "5150495249" -> [0x51,0x50,0x49,0x52,0x49]
        try:
            data = bytearray.fromhex(cmd_str.replace(' ', ''))
        except:
            data = bytearray(cmd_str.encode('ascii'))
    
    crc = calculate_crc(data)
    data.append(crc & 0xFF)        # CRC low byte
    data.append((crc >> 8) & 0xFF) # CRC high byte
    data.append(0x0D)              # Terminator
    return data

def send_to_inverter(command, ip, port, timeout=2):
    """Send a command to the inverter and wait for the response."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(timeout)
            sock.connect((ip, port))
            sock.sendall(command)
            
            # Read response
            response = b""
            start = time.time()
            while time.time() - start < timeout:
                try:
                    chunk = sock.recv(1024)
                    if chunk:
                        response += chunk
                        if b'\r' in response:
                            break
                except socket.timeout:
                    break
            
            if not response:
                return "Error en configuracion"
                
            # Check response format
            if response.startswith(b'(ACK'):
                return "Comando aceptado"
            elif response.startswith(b'(NAK'):
                return "Error en configuracion"
            else:
                # Some commands return data, not ACK/NAK
                # But for write commands, we expect ACK/NAK
                return "Comando aceptado"  # assume success if there's a response
                
    except Exception as e:
        print(f"TCP Error: {e}")
        return "Error en configuracion"

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path)
        if parsed.path.startswith('/config/'):
            rel = os.path.relpath(parsed.path, '/config')
            return os.path.join('/app/config', rel)
        else:
            return os.path.join('/app/www', parsed.path.lstrip('/'))

    def do_POST(self):
        if self.path == '/api/send-command':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                command_str = data.get('command', '')
                ip = data.get('ip', '127.0.0.1')
                port = data.get('port', 26)
                
                if not command_str:
                    self.send_error(400, "Command missing")
                    return
                
                # Build binary command
                command_bytes = build_command(command_str)
                # Send and wait for response
                result = send_to_inverter(command_bytes, ip, port)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': result}).encode())
                
            except Exception as e:
                print(f"Error in /api/send-command: {e}")
                self.send_error(500, "Internal error")
        else:
            self.send_error(404)

    def do_PUT(self):
        if self.path.startswith('/config/') and self.path.endswith('.json'):
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                config = json.loads(post_data.decode('utf-8'))

                safe_path = os.path.join('/app/config', os.path.basename(self.path))
                if not safe_path.startswith('/app/config/'):
                    self.send_error(403, "Access denied")
                    return

                with open(safe_path, 'w') as f:
                    json.dump(config, f, indent=2)

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"OK")
            except Exception as e:
                print("Error saving config:", e)
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Error saving config")
        else:
            self.send_response(403)
            self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

PORT = 60606
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Web server on port {PORT}")
    httpd.serve_forever()
