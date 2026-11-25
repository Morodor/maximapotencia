import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error || new Error('Error inesperado en el módulo.')
    };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary:${this.props.moduleName || 'App'}]`, error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReloadApp = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[45vh] w-full flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Algo salió mal en este módulo
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Se detectó un fallo al renderizar {this.props.moduleName ? `la vista "${this.props.moduleName}"` : 'la aplicación'}. Tus datos siguen a salvo.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                  <p className="text-[11px] font-mono text-red-300 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-950/40 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar módulo</span>
              </button>
              <button
                type="button"
                onClick={this.handleReloadApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
