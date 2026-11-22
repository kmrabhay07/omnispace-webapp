"""OCI deployment readiness check; credentials stay in process memory."""
import json
import subprocess
import sys
import urllib.error
import urllib.request


def main():
    try:
        container = subprocess.check_output(['sudo','-n','docker','compose','ps','-q','backend'],text=True).strip()
        if not container:
            return 1
        detail = json.loads(subprocess.check_output(['sudo','-n','docker','inspect',container],text=True))[0]
        environment = dict(value.split('=',1) for value in detail['Config']['Env'] if '=' in value)
        secret = environment.get('OMNISPACE_PROXY_SECRET','')
        headers = {'X-Omnispace-Proxy':secret} if secret else {}
        request = urllib.request.Request('http://127.0.0.1:8080/api/properties?page=0',headers=headers)
        with urllib.request.urlopen(request,timeout=3) as response:
            return 0 if response.status == 200 else 1
    except (OSError,subprocess.SubprocessError,ValueError,KeyError,urllib.error.URLError):
        return 1


if __name__ == '__main__':
    sys.exit(main())
