export interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean; // exclude 0, O, l, 1, I
}

export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = 14,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = false,
  } = options;

  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lower = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()_+~|}{[]:;?><,.-=';

  if (excludeAmbiguous) {
    upper = upper.replace(/[OI]/g, '');
    lower = lower.replace(/[ol]/g, '');
    numbers = numbers.replace(/[01]/g, '');
  }

  let charPool = '';
  const mandatoryChars: string[] = [];

  if (includeUppercase) {
    charPool += upper;
    mandatoryChars.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (includeLowercase) {
    charPool += lower;
    mandatoryChars.push(lower[Math.floor(Math.random() * lower.length)]);
  }
  if (includeNumbers) {
    charPool += numbers;
    mandatoryChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (includeSymbols) {
    charPool += symbols;
    mandatoryChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  if (charPool.length === 0) {
    charPool = lower + numbers;
  }

  const result: string[] = [...mandatoryChars];
  for (let i = result.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charPool.length);
    result.push(charPool[randomIndex]);
  }

  // Shuffle the result array
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

export function generateHotspotPin(length: number = 6): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Sangat Lemah' | 'Lemah' | 'Cukup' | 'Kuat' | 'Sangat Kuat';
  color: string;
} {
  if (!password) {
    return { score: 0, label: 'Sangat Lemah', color: 'bg-red-500' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: 'Sangat Lemah', color: 'bg-red-500' };
  } else if (score === 2) {
    return { score: 2, label: 'Lemah', color: 'bg-orange-500' };
  } else if (score === 3) {
    return { score: 3, label: 'Cukup', color: 'bg-yellow-500' };
  } else if (score === 4) {
    return { score: 4, label: 'Kuat', color: 'bg-emerald-500' };
  } else {
    return { score: 5, label: 'Sangat Kuat', color: 'bg-teal-600' };
  }
}
