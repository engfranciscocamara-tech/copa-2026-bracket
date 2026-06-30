import re

html = open(r'C:\Users\francisco.camara\.gemini\antigravity\brain\87bba8a1-e6e3-4236-a0ee-96420ff055e8\.system_generated\steps\327\content.md', encoding='utf-8').read()
# Find all matchups
matchups = html.split('<div class="BracketMatchup__Wrapper">')[1:]
for i, m in enumerate(matchups):
    teams = re.findall(r'<div class="BracketCell__Name[^"]*">(.*?)</div>', m)
    status_match = re.search(r'<div class="SeriesFooter__Status[^"]*">(.*?)</div>', m)
    status = status_match.group(1).strip() if status_match else ""
    if len(teams) >= 2:
        print(f"{teams[0]} vs {teams[1]}: {status}")
