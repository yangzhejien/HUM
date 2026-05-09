import requests
import json

# Supabase configuration
SUPABASE_URL = "https://gslggufgrtmdeyyyveay.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.yeqCTdqy8y-P5sobA_KJi6iIf2e3YyPaDOJDRJSoyVg"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json"
}

# Try to insert a test article to check if RLS is blocking
test_article = {
    "title": "Test Article RLS Check",
    "author": "Test",
    "email": "test@test.com",
    "category": "public",
    "status": "pending",
    "content": "Test content"
}

print("Testing insert with anon key...")

# First, test with anon key
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

anon_headers = {
    "Authorization": f"Bearer {anon_key}",
    "apikey": anon_key,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

response = requests.post(
    f"{SUPABASE_URL}/rest/v1/articles",
    headers=anon_headers,
    json=test_article
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 201:
    print("[OK] Insert successful! RLS allows anonymous inserts.")
    # Clean up test article
    if response.json():
        article_id = response.json()[0].get('id')
        if article_id:
            del_response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/articles?id=eq.{article_id}",
                headers=headers  # Use service key to delete
            )
            print(f"Cleaned up test article: {del_response.status_code}")
elif response.status_code == 403:
    print("[ERROR] RLS is blocking anonymous inserts!")
    print("You need to run SQL in Supabase Dashboard SQL Editor to fix RLS.")
