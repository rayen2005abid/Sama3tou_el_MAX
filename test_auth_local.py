
from backend import auth

# Test Password Hashing
pwd = "testpassword"
hashed = auth.get_password_hash(pwd)
print(f"Password '{pwd}' hashed: {hashed}")
assert auth.verify_password(pwd, hashed)
print("Password verification successful.")

# Test JWT Generation
token = auth.create_access_token({"sub": "testuser"})
print(f"Generated Token: {token}")
decoded = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
print(f"Decoded Token: {decoded}")
assert decoded["sub"] == "testuser"
print("JWT verification successful.")
