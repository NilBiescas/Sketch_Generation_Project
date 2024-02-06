import paramiko
from paramiko import SSHClient
from scp import SCPClient

def send_image(local_image_path, remote_path, hostname, port, username, password):
    # Initialize SSH client
    ssh = SSHClient()
    ssh.load_system_host_keys()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Connect to the server with the specified port
    ssh.connect(hostname, port=port, username=username, password=password)

    # SCPClient takes a paramiko transport as an argument
    scp = SCPClient(ssh.get_transport())

    # Transfer the file
    scp.put(local_image_path, remote_path)

    # Close SCP Client
    scp.close()

    # Close the SSH connection
    ssh.close()

# Usage
send_image('Outputs/Wacom/Png_final_results/cervell.png', 
           '/home/GROUP04/IMG_FROM_LOCAL/Sketch_output', 
           '158.109.8.116', 
           '22345',
           'GROUP04', 
           'weareop')
