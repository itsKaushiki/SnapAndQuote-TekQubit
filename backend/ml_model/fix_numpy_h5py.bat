@echo off
REM Fix numpy/scipy/h5py compatibility issue
REM This script reinstalls numpy, scipy, and related packages to fix import errors

echo Fixing numpy/scipy/h5py compatibility issue...
echo.
echo This will reinstall numpy, scipy, scikit-learn, and h5py in the correct order...
echo.

REM Step 1: Uninstall problematic packages
echo Step 1: Uninstalling numpy, scipy, scikit-learn, and h5py...
pip uninstall -y numpy scipy scikit-learn h5py

echo.
echo Step 2: Reinstalling numpy (compatible version)...
pip install --no-cache-dir "numpy>=1.24.0,<2.0.0"

echo.
echo Step 3: Reinstalling scipy (compatible with numpy)...
pip install --no-cache-dir "scipy>=1.10.0,<1.14.0"

echo.
echo Step 4: Reinstalling scikit-learn...
pip install --no-cache-dir "scikit-learn>=1.0.0,<1.5.0"

echo.
echo Step 5: Reinstalling h5py...
pip install --no-cache-dir "h5py>=3.7.0,<3.11.0"

echo.
echo Step 6: Verifying installation...
python -c "import numpy; import scipy; import sklearn; import h5py; print('All packages imported successfully!')"

echo.
echo Done! Please try running the audio analysis again.

pause

