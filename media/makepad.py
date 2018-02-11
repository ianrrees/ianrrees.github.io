# Prints TeX code for a grid of cryptographically-random characters
# Can be used like 'python3 makepad.py | pdflatex -jobname=grid'
# Ian Rees 2018

import string
import secrets # added to Python in 3.6

availableChars = string.ascii_letters + string.digits + string.punctuation

availableChars.replace('/', "")

def texArmor(c):
    "Given character c, returns TeX code to make that character in a matrix"

    if c in "#$%&_{}":
        return "\\" + c

    if c == '\\':
        return "\\backslash"

    if c == '^':
        return "\widehat{}"

    if c == '~':
        return "\\sim"

    return c

head = r"""
\documentclass[a5paper]{article}
    \usepackage{amsmath}
    \usepackage[margin=0.5in]{geometry}
    \pagestyle{empty}

\begin{document}

\setcounter{MaxMatrixCols}{100}

\begin{center}
\(
\begin{matrix}
"""

height = 32
width = 16

matrix = ""
for row in range(height):
    vals = [texArmor(secrets.choice(availableChars)) for x in range(width)]
    matrix += " & ".join(vals)
    if row != height-1:
        matrix += "\\\\"
    matrix += '\n'


tail = r"""
\end{matrix}
\)

\end{center}

\end{document}
"""

print(head + matrix + tail)