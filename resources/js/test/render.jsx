import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(ui, { route = '/', entries = [route] } = {}) {
  return render(
    <MemoryRouter initialEntries={entries}>
      {ui}
    </MemoryRouter>,
  );
}

export * from '@testing-library/react';
