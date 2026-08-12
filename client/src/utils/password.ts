export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One capital letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PASSWORD_HINT =
  'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number and a special character';

export function isPasswordPolicyCompliant(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
