"""Use existing Git Credential Manager access without writing credentials to disk."""
import argparse
import json
import os
import subprocess
import urllib.error
import urllib.request

REPOSITORY = 'fichera9188/dataviz'

def request(method, endpoint, payload=None):
    env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never')
    credential = subprocess.run(['git', 'credential', 'fill'],
        input='protocol=https\nhost=github.com\n\n', text=True,
        capture_output=True, env=env)
    values = dict(line.split('=', 1) for line in credential.stdout.splitlines() if '=' in line)
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'dataviz-project-setup',
               'X-GitHub-Api-Version': '2022-11-28'}
    if values.get('password'):
        headers['Authorization'] = 'Bearer ' + values['password']
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request('https://api.github.com/' + endpoint, body, headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.load(response) if response.status != 204 else {}
            return response.status, result
    except urllib.error.HTTPError as error:
        try:
            result = json.load(error)
        except ValueError:
            result = {'message': error.reason}
        return error.code, result

parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['inspect', 'pages', 'runs', 'enable-pages'])
args = parser.parse_args()
endpoint = 'repos/' + REPOSITORY
if args.action == 'inspect':
    status, result = request('GET', endpoint)
    print(json.dumps({'status': status, **{k: result.get(k) for k in
        ['full_name', 'private', 'default_branch', 'permissions', 'size', 'message']}}, indent=2))
elif args.action == 'pages':
    status, result = request('GET', endpoint + '/pages')
    print(json.dumps({'status': status, **{k: result.get(k) for k in
        ['html_url', 'status', 'build_type', 'source', 'message']}}, indent=2))
elif args.action == 'enable-pages':
    status, result = request('POST', endpoint + '/pages', {'build_type': 'workflow'})
    print(json.dumps({'status': status, **{k: result.get(k) for k in
        ['html_url', 'build_type', 'message']}}, indent=2))
else:
    status, result = request('GET', endpoint + '/actions/runs?per_page=3')
    runs = [{k: run.get(k) for k in ['id', 'name', 'status', 'conclusion', 'html_url', 'head_sha']}
            for run in result.get('workflow_runs', [])]
    print(json.dumps({'status': status, 'runs': runs, 'message': result.get('message')}, indent=2))
