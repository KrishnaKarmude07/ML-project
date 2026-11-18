import os
import numpy as np
import pandas as pd

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
CSV_PATH = os.path.join(DATA_DIR, "insurance_data.csv")

def generate_synthetic_insurance_dataset(num_rows: int = 2000, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    
    ages = rng.integers(18, 65, size=num_rows)
    sexes = rng.choice(['male', 'female'], size=num_rows, p=[0.505, 0.495])
    bmis = np.round(np.clip(rng.normal(loc=30.66, scale=6.05, size=num_rows), 16.0, 53.0), 2)
    children = rng.choice([0, 1, 2, 3, 4, 5], size=num_rows, p=[0.425, 0.245, 0.18, 0.11, 0.025, 0.015])
    smokers = rng.choice(['yes', 'no'], size=num_rows, p=[0.205, 0.795])
    regions = rng.choice(['southwest', 'southeast', 'northwest', 'northeast'], size=num_rows, p=[0.245, 0.27, 0.245, 0.24])
    
    region_multiplier = {
        'southeast': 1.045,
        'northeast': 1.025,
        'northwest': 0.985,
        'southwest': 0.965
    }
    
    charges = []
    for i in range(num_rows):
        age = ages[i]
        bmi = bmis[i]
        child = children[i]
        smoker = smokers[i]
        reg = regions[i]
        
        base_claim = 2450.0 + (age * 242.0) + (child * 475.0)
        reg_mult = region_multiplier[reg]
        
        if smoker == 'no':
            if bmi < 30.0:
                claim = (base_claim + (bmi * 88.0) + rng.normal(0, 680.0)) * reg_mult
            else:
                claim = (base_claim + (bmi * 145.0) + rng.normal(0, 850.0)) * reg_mult
        else:
            if bmi < 30.0:
                claim = (base_claim + 13800.0 + (bmi * 210.0) + (age * 70.0) + rng.normal(0, 1400.0)) * reg_mult
            else:
                bmi_spike = 1500.0 * (np.exp((bmi - 30.0) / 10.0) - 1.0)
                claim = (base_claim + 31200.0 + bmi_spike + (age * 165.0) + rng.normal(0, 2100.0)) * reg_mult
        
        claim = max(1121.87, round(claim, 2))
        charges.append(claim)
        
    df = pd.DataFrame({
        'age': ages,
        'sex': sexes,
        'bmi': bmis,
        'children': children,
        'smoker': smokers,
        'region': regions,
        'charges': charges
    })
    
    return df

def get_or_create_dataset() -> pd.DataFrame:
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
        if len(df) == 2000 and {'age', 'sex', 'bmi', 'children', 'smoker', 'region', 'charges'}.issubset(df.columns):
            return df
    
    df = generate_synthetic_insurance_dataset(num_rows=2000, random_state=42)
    df.to_csv(CSV_PATH, index=False)
    return df
