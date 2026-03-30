# Code Calisthenics Checklist

## Core checks
- More than one indentation level inside a method?
- Any else blocks?
- Any primitive obsession?
- Any collection passed around without its own abstraction?
- Any method doing more than one thing?
- Any name that hides domain meaning?
- Any obvious guard clause missing?

## Refactor priorities
1. Flatten control flow
2. Extract domain concepts
3. Improve names
4. Separate responsibilities
5. Reduce incidental complexity
