import random

def startguessing(start, end):
  secret = random.randint(start, end) # pick a secret number
  attempts = 0

  print(f"I've thought of a number between {start} and {end}.")
  print("Try to guess it!")

  while True: # boolean values: True, False
      attempts += 1
      user_input = input(f"Attempt {attempts}: Enter your guess: ")

      # empty string is falsy, so it's checked with the not logical operator
      if not user_input:
          print("Empty input, try again!")
          attempts -= 1
          continue

      try:
          # variables are either global or function level
          guess = int(user_input) # convert input to integer
      except ValueError:
          print("Invalid input. Please enter a whole number.")
          attempts -= 1
      except EOFError:
          print(f"Quitting the game. The number was {secret}")
          break
      finally:
          pass # empty block is a syntax error, so we do nothing with pass

      if guess < 1 or guess > 100: # logical operators: or, and
          print("Please guess a number between 1 and 100.")
          attempts -= 1
      elif guess < secret: # elif instead of 'else if'
          print(f"Too low! ({guess})")
      elif guess > secret:
          print(f"Too high! ({guess})")
      else:
          print(f"Congratulations! You guessed the number {secret} correctly in {attempts} attempts! 🎉")
          break