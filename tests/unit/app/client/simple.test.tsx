// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

// Simple React component for testing
function SimpleComponent({ message }: { message: string }) {
  return <div data-testid="message">{message}</div>
}

describe.skip('Simple React Test', () => {
  it('should render a simple component', () => {
    render(<SimpleComponent message="Hello Test!" />)

    const messageElement = screen.getByTestId('message')
    expect(messageElement).toBeInTheDocument()
    expect(messageElement).toHaveTextContent('Hello Test!')
  })

  it('should handle different props', () => {
    render(<SimpleComponent message="Different message" />)

    expect(screen.getByText('Different message')).toBeInTheDocument()
  })
})
