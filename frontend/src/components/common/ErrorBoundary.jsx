import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-6">
          <div className="bg-brand-black-light border border-brand-red/40 rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-brand-red text-lg font-bold mb-2">Something went wrong</h2>
            <pre className="text-brand-gray text-xs bg-brand-black rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => window.location.href = '/login'}
              className="btn-primary mt-4"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
