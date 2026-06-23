import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SecureVote login screen', () => {
  render(<App />);
  const titleElement = screen.getByText(/SecureVote/i);
  expect(titleElement).toBeInTheDocument();
});
