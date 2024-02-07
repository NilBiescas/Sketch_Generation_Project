import paramiko
from paramiko import SSHClient
from scp import SCPClient
from pathlib import Path
from argparse import ArgumentParser
from Wacom_api.convert2bmp import create_inkml_file

def receive_image(remote_image_path, local_path, hostname, port, username, password):
    # Initialize SSH client
    ssh = SSHClient()
    ssh.load_system_host_keys()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Connect to the server with the specified port
    ssh.connect(hostname, port=port, username=username, password=password)

    # SCPClient takes a paramiko transport as an argument
    scp = SCPClient(ssh.get_transport())

    # Transfer the file
    scp.get(remote_image_path, local_path)

    # Close SCP Client
    scp.close()

    # Close the SSH connection
    ssh.close()

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

# Folder from which we are going to send the images of the wacom output to the cluster
FOLDER_SENDING_FROM_LOCAL = Path('Outputs/Wacom/Png_final_results')

# Folder in which we are going to save the image of the text2Sketch model in the cluster
FOLDER_SAVING_TO_LOCAL = Path('Outputs/Models/Text2Sketch')

# Folder in which we are going to store the images of the wacom output in the cluster
FOLDER_STORING_IN_CLUSTER = Path('/home/GROUP04/Connection_Host_Cluster/Output_Wacom')

# Folder from which we are going to retrieve the images from the text2Sketch model
FOLDER_GETTING_FROM_CLUSTER = Path('/home/GROUP04/Connection_Host_Cluster/Output_text2Sketch')

HOSTNAME = '158.109.8.116'
PORT = '22345'
USERNAME = 'GROUP04'


def args():
    parser = ArgumentParser()
    parser.add_argument("--source", type=Path, help="source image file")
    args = parser.parse_args()
    path = args.source
    filename = path.name.split(".")[0]
    return path, filename

if __name__ == '__main__':
    # Receive the images from the text2Sketch model
    path, filename = args()  # This is the filename that needs to match with the one in the cluster folder
    receive_image(remote_image_path = FOLDER_GETTING_FROM_CLUSTER / filename + '.png',
                  local_path        = FOLDER_SAVING_TO_LOCAL,
                  hostname          = HOSTNAME,
                  port              = PORT,
                  username          = USERNAME)
    
    create_inkml_file(path=path, filename=filename)

    send_image(local_image_path = FOLDER_SENDING_FROM_LOCAL / filename + '.png',
               remote_path       = FOLDER_STORING_IN_CLUSTER,
               hostname          = HOSTNAME,
               port              = PORT,
               username          = USERNAME)

