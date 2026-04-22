import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Verificar2FA() {
  const [codigo, setCodigo] = useState('');
  const [qrData, setQRData] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);

  const { verificarDosFA, generarDosFA, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario_id, email, qr, secret, es_registro } = location.state || {};

  useEffect(() => {
    if (!usuario_id) {
      navigate('/login');
      return;
    }

    // Si viene del REGISTRO, mostrar QR directamente
    if (es_registro && qr) {
      setQRData({ qr, secret });
      setEsRegistro(true);
      setMensaje('✅ QR generado. Escanea con tu app de autenticación');
    } else {
      // Si viene del LOGIN, solo pedir código
      setEsRegistro(false);
      setMensaje('📱 Ingresa el código de tu app de autenticación');
    }
  }, []);

  const handleGenerarQR = async () => {
    try {
      const resultado = await generarDosFA(usuario_id);
      setQRData(resultado);
      setMensaje('✅ QR generado. Escanea con tu app de autenticación');
    } catch (error) {
      setMensaje('❌ Error generando QR');
    }
  };

  const handleVerificar = async (e) => {
    e.preventDefault();

    if (codigo.length !== 6) {
      setMensaje('❌ El código debe tener 6 dígitos');
      return;
    }

    try {
      await verificarDosFA(usuario_id, codigo);
      setMensaje('✅ 2FA verificado correctamente');
      
      if (esRegistro) {
        // Si viene del registro, ir a login
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Si viene del login, ir al dashboard
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      setMensaje('❌ Código incorrecto');
      setCodigo('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          🔐 Autenticación 2FA
        </h1>
        <p className="text-center text-gray-600 mb-6">{email}</p>

        {mensaje && (
          <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded">
            {mensaje}
          </div>
        )}

        {/* QR solo en REGISTRO */}
        {esRegistro && !qrData && (
          <button
            onClick={handleGenerarQR}
            disabled={cargando}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 mb-4"
          >
            {cargando ? '⏳ Generando...' : '📱 Generar Código QR'}
          </button>
        )}

        {/* Mostrar QR si existe */}
        {qrData && (
          <div className="mb-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
              <img src={qrData.qr} alt="QR Code" className="w-full" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-2">
              O ingresa manualmente:
            </p>
            <p className="text-center font-mono bg-gray-100 p-2 rounded text-sm break-all">
              {qrData.secret}
            </p>
          </div>
        )}

        {/* Formulario para ingresar código */}
        <form onSubmit={handleVerificar} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={cargando || codigo.length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {cargando ? '⏳ Verificando...' : '✓ Verificar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          💡 Usa: Google Authenticator, Microsoft Authenticator o Authy
        </p>
      </div>
    </div>
  );
}