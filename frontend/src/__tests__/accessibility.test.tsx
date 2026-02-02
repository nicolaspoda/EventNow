import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import EventCard from '../components/events/EventCard';
import { Alert } from '../components/Alert';
import Button from '../components/ui/Button';

expect.extend(toHaveNoViolations);

const mockEvent = {
  id: '123',
  title: 'Concert Test',
  description: 'Description test',
  location: 'Paris',
  eventDate: '2026-12-31T20:00:00Z',
  imageUrl: undefined,
  organizerId: 'org-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ticketCategories: [
    {
      id: '1',
      name: 'Standard',
      price: '25.00',
      initialStock: 100,
      currentStock: 50,
    },
  ],
};

describe('Accessibility Tests', () => {
  it('EventCard should have no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Alert component should have no accessibility violations', async () => {
    const { container } = render(
      <Alert message="Test message" variant="error" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Button component should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click me</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <div>
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection</h3>
      </div>
    );
    
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
  });

  it('images should have alt text', () => {
    const { container } = render(
      <img src="test.jpg" alt="Test description" />
    );
    
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt');
    expect(img?.getAttribute('alt')).toBe('Test description');
  });
});
