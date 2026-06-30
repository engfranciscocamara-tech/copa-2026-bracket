import re

file_path = r'C:\Users\francisco.camara\.gemini\antigravity\brain\87bba8a1-e6e3-4236-a0ee-96420ff055e8\.system_generated\steps\109\content.md'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all team names in the bracket
matches = re.findall(r'<div class="BracketCell__Name truncate[^"]*">(.*?)<\/div>', content)

# The first 32 teams correspond to the 16 Round of 32 matchups in top-to-bottom order.
round_of_32 = matches[:32]
matchups = []
for i in range(0, 32, 2):
    matchups.append(f"{round_of_32[i]} x {round_of_32[i+1]}")

for idx, m in enumerate(matchups):
    print(f"{idx+1}. {m}")
