#!/bin/bash
# Script to activate the Flask virtual environment

echo "Activating Flask virtual environment..."
source venv/bin/activate
echo "Virtual environment activated!"
echo "Python path: $(which python)"
echo "Pip path: $(which pip)"
echo "Installed packages:"
pip list