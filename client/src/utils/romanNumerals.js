// Convert year of study to Roman numerals
export const yearToRoman = (yearString) => {
  const yearMap = {
    '2nd Year': 'II',
    '3rd Year': 'III',
    '4th Year': 'IV',
    '1st Year': 'I'
  };

  return yearMap[yearString] || yearString;
};

export const romanToYear = (romanString) => {
  const romanMap = {
    'I': '1st Year',
    'II': '2nd Year',
    'III': '3rd Year',
    'IV': '4th Year'
  };

  return romanMap[romanString] || romanString;
};

export const yearOptions = [
  { value: '2nd Year', label: 'II' },
  { value: '3rd Year', label: 'III' },
  { value: '4th Year', label: 'IV' }
];
