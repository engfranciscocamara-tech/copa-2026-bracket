import re

file_path = r'C:\Users\francisco.camara\.gemini\antigravity\brain\87bba8a1-e6e3-4236-a0ee-96420ff055e8\.system_generated\steps\109\content.md'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'<div class=""BracketCell__Name truncate[^""]*"">(.*?)<\/div>', content)
round_of_32 = matches[:32]
print(round_of_32)
