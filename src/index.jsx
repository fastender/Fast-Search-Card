// src/index.js
import { h, render } from 'preact';
import { SearchField } from './components/SearchField';

function App() {
  return (
    <div style={{ 
      // Hintergrundbild von Unsplash
      backgroundImage: `url('https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Dunkler Overlay für bessere Lesbarkeit */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.15) 0%, rgba(22, 33, 62, 0.25) 100%)',
        backdropFilter: 'blur(0px) saturate(150%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '40px'
      }}>
        <SearchField />
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));