#!/usr/bin/env python3
"""验证 papers bucket 状态和权限 - 使用 requests"""
import requests
import json

SUPABASE_URL = "https://gslggufgrtmdeyyyveay.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.H2W8ZfW2gQ-YF8ZfW2gQ-YF8ZfW2gQ-YF8ZfW2g"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

def check_with_key(key, key_name):
    print(f"\n{'='*60}")
    print(f"使用 {key_name} 检查:")
    print('='*60)
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    # 1. 列出所有 buckets
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    resp = requests.get(url, headers=headers)
    print(f"1. 列出 buckets: {resp.status_code}")
    if resp.status_code == 200:
        buckets = resp.json()
        print(f"   找到 {len(buckets)} 个 buckets:")
        for b in buckets:
            public = b.get('public', 'unknown')
            print(f"   - {b['name']} (public={public})")
    else:
        print(f"   错误: {resp.text[:200]}")
    
    # 2. 检查 papers bucket
    url = f"{SUPABASE_URL}/storage/v1/object/list/papers"
    resp = requests.post(url, headers=headers, json={"prefix": ""})
    print(f"\n2. 访问 papers bucket: {resp.status_code}")
    if resp.status_code == 200:
        files = resp.json()
        print(f"   文件数量: {len(files)}")
        for f in files[:3]:
            print(f"   - {f.get('name', 'unknown')}")
    else:
        print(f"   错误: {resp.text[:300]}")
    
    # 3. 检查 articles bucket (对比)
    url = f"{SUPABASE_URL}/storage/v1/object/list/articles"
    resp = requests.post(url, headers=headers, json={"prefix": ""})
    print(f"\n3. 访问 articles bucket: {resp.status_code}")
    if resp.status_code == 200:
        files = resp.json()
        print(f"   文件数量: {len(files)}")

# 检查 service role key
print("[SERVICE ROLE KEY - 管理权限]")
check_with_key(SUPABASE_SERVICE_KEY, "Service Role Key")

# 检查 anon key
print("\n\n[ANON KEY - 匿名用户权限]")
check_with_key(ANON_KEY, "Anon Key")

print("\n\n" + "="*60)
print("总结:")
print("="*60)
print("如果 Anon Key 无法访问 papers bucket，需要:")
print("1. 在 Supabase Dashboard > Storage > Buckets 中")
print("2. 找到 papers bucket，点击编辑")
print("3. 设置为 Public (公开)")
print("4. 或添加 RLS 策略允许匿名读取")
