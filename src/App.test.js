import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the  savor workspace', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Today's favorites/i })).toBeInTheDocument();
  expect(screen.queryByText(/Current order/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Open cart/ }));
  expect(screen.getByText(/Current order/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Kitchen' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reports' })).not.toBeInTheDocument();
});

test('shows kitchen tools for kitchen role and owner tools for owner role', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Staff sign in' }));
  expect(screen.getByRole('button', { name: /Kitchen/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Reports/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Owner sign in' }));
  expect(screen.getByRole('button', { name: /Reports/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Menu manager/ })).toBeInTheDocument();
});
