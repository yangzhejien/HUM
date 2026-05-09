#!/usr/bin/env python3
"""验证 papers bucket 状态和权限"""
import os
import sys

# 添加项目路径
sys.path.insert(0, r'C:\Users\11409\Desktop\HUM-github')
os.chdir(r'C:\Users\11409\Desktop\HUM-github')

from supabase import create_client

SUPABASE_URL = "https://gslggufgrtmdeyyyveay.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.H2W8ZfW2gQ-YF8ZfW2gQ-YF8ZfW2gQ-YF8ZfW2g"

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # 1. 列出所有 buckets
    print("=" * 60)
    print("1. 所有 Buckets:")
    print("=" * 60)
    buckets = supabase.storage.list_buckets()
    for bucket in buckets:
        print(f"  - {bucket.name}: public={bucket.public}")
    
    # 2. 检查 papers bucket 是否存在
    print("\n" + "=" * 60)
    print("2. Papers Bucket 详情:")
    print("=" * 60)
    try:
        files = supabase.storage.from_('papers').list()
        print(f"  ✓ papers bucket 存在")
        print(f"  文件数量: {len(files)}")
        for f in files[:5]:  # 只显示前5个
            print(f"    - {f['name']}")
    except Exception as e:
        print(f"  ✗ papers bucket 错误: {e}")
    
    # 3. 检查 bucket 权限策略
    print("\n" + "=" * 60)
    print("3. Bucket 权限:")
    print("=" * 60)
    
    # 尝试用 anon key 方式检查
    import requests
    
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"
    
    # 测试匿名访问
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}"
    }
    
    # 尝试列出 buckets (anon key)
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    resp = requests.get(url, headers=headers)
    print(f"  Anon key 列出 buckets: {resp.status_code}")
    if resp.status_code == 200:
        buckets_data = resp.json()
        print(f"  可见 buckets: {[b['name'] for b in buckets_data]}")
    
    # 尝试访问 papers bucket (anon key)
    url = f"{SUPABASE_URL}/storage/v1/object/list/papers"
    resp = requests.post(url, headers=headers, json={"prefix": ""})
    print(f"\n  Anon key 访问 papers: {resp.status_code}")
    if resp.status_code != 200:
        print(f"  错误: {resp.text}")
    
    print("\n" + "=" * 60)
    print("4. 建议:")
    print("=" * 60)
    print("  如果 anon key 无法访问，需要:")
    print("  1. 在 Supabase Dashboard 中设置 bucket 为 public")
    print("  2. 或者添加 RLS 策略允许匿名读取")
    
except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()
