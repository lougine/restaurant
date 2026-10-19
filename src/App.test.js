import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the Ember House workspace', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Good food, made easy/i })).toBeInTheDocument();
  expect(screen.getByText(/Current order/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Kitchen' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reports' })).not.toBeInTheDocument();
});

test('reveals staff tools only after staff sign in', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Staff sign in' }));
  expect(screen.getByRole('button', { name: /Kitchen/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reports/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.queryByRole('button', { name: /Kitchen/ })).not.toBeInTheDocument();
});
