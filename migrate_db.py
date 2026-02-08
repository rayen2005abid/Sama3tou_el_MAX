"""
Database migration script to update schema from knowledge_score to trading_experience
"""
import sqlite3
import os

db_path = "trading.db"

if not os.path.exists(db_path):
    print("Database doesn't exist yet. It will be created on server startup.")
    exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if trading_experience column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "trading_experience" in columns:
        print("✓ Database already has trading_experience column")
    else:
        print("Adding trading_experience column...")
        
        # Add the new column with default value
        cursor.execute("ALTER TABLE users ADD COLUMN trading_experience TEXT DEFAULT 'new'")
        
        # If knowledge_score exists, migrate data
        if "knowledge_score" in columns:
            print("Migrating data from knowledge_score to trading_experience...")
            cursor.execute("""
                UPDATE users 
                SET trading_experience = CASE 
                    WHEN knowledge_score <= 3 THEN 'new'
                    WHEN knowledge_score <= 6 THEN 'basics'
                    ELSE 'active'
                END
            """)
            print("✓ Data migrated successfully")
        
        conn.commit()
        print("✓ Database schema updated successfully!")
        
except sqlite3.Error as e:
    print(f"✗ Error: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nYou can now restart the server.")
