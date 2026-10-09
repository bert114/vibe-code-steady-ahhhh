import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'

describe('Clerk default routing fallback (avoids 404)', () => {
  it('renders SignInPage fallback on /sign-in without 404', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('renders SignInPage fallback on nested subpath /sign-in/sso-callback without 404', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in/sso-callback']}>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('renders SignUpPage fallback on /sign-up without 404', () => {
    render(
      <MemoryRouter initialEntries={['/sign-up']}>
        <Routes>
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('renders SignUpPage fallback on nested subpath /sign-up/verify without 404', () => {
    render(
      <MemoryRouter initialEntries={['/sign-up/verify']}>
        <Routes>
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })
})
