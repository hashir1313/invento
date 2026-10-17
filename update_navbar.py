import re

with open("components/Navbar.tsx", "r") as f:
    content = f.read()

# I will just write a new file instead of regex replacing since it's easier to reason about.
