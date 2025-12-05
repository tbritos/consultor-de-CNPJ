'use client';

import React, { useState } from 'react';
import { Search, Building2, MapPin, Phone, Calendar, Users, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  qsa: Array<{ nome_socio: string; qualificacao_socio: string }>;
}

export default function CNPJLookup() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Verifica se o input parece um nome (tem letras) ou CNPJ
  const isNameSearch = /[a-zA-Z]/.test(input);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Se o usuário estiver tentando digitar um CNPJ (só números/símbolos), aplicamos máscara
    if (!/[a-zA-Z]/.test(value)) {
        let numericValue = value.replace(/\D/g, '');
        if (numericValue.length > 14) numericValue = numericValue.slice(0, 14);
        
        // Máscara visual apenas
        numericValue = numericValue.replace(/^(\d{2})(\d)/, '$1.$2');
        numericValue = numericValue.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        numericValue = numericValue.replace(/\.(\d{3})(\d)/, '.$1/$2');
        numericValue = numericValue.replace(/(\d{4})(\d)/, '$1-$2');
        setInput(numericValue);
    } else {
        // Se tem letras, deixa livre para digitar o nome
        setInput(value);
    }
  };

  const handleSearch = async () => {
    if (isNameSearch) {
        // Se for nome, abrimos o Google numa nova aba com uma busca focada
        window.open(`https://www.google.com/search?q=cnpj+empresa+${encodeURIComponent(input)}`, '_blank');
        return;
    }

    const rawCnpj = input.replace(/\D/g, '');
    
    if (rawCnpj.length !== 14) {
      setError('Para buscar direto, digite um CNPJ válido (14 números). Para nomes, clique em "Buscar no Google".');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('CNPJ não encontrado na base oficial.');
        if (response.status === 429) throw new Error('Muitas requisições. Espere um pouco.');
        throw new Error('Erro ao buscar dados.');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = `Empresa: ${data.razao_social}\nCNPJ: ${data.cnpj}\nEndereço: ${data.logradouro}, ${data.numero} - ${data.municipio}/${data.uf}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consulta CNPJ & Empresas</h1>
          <p className="text-gray-500">Digite o CNPJ para dados oficiais ou o nome da empresa para buscar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Digite o CNPJ ou Nome da Empresa..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg text-gray-900"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-white ${isNameSearch ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isNameSearch ? <ExternalLink className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  <span>{isNameSearch ? 'Buscar no Google' : 'Consultar API'}</span>
                </>
              )}
            </button>
          </div>
          
          {isNameSearch && !error && (
            <p className="mt-3 text-sm text-blue-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Dica: Buscas por nome requerem confirmação externa. Clique para encontrar o CNPJ correto.
            </p>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {data && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 px-6 py-6 sm:px-8 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{data.nome_fantasia || data.razao_social}</h2>
                <p className="text-indigo-100 text-sm font-mono opacity-90">{data.cnpj}</p>
              </div>
              <button 
                onClick={copyToClipboard}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
                title="Copiar dados"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="p-6 sm:p-8 grid gap-8 sm:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Razão Social</h3>
                  <p className="text-gray-900 font-medium">{data.razao_social}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Endereço
                  </h3>
                  <p className="text-gray-900">{data.logradouro}, {data.numero}</p>
                  <p className="text-gray-600">{data.bairro} • {data.municipio}/{data.uf}</p>
                  <p className="text-gray-500 text-sm mt-1">CEP: {data.cep}</p>
                </div>

                <div>
                   <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Início da Atividade
                  </h3>
                   <p className="text-gray-900">{data.data_inicio_atividade}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Contato
                  </h3>
                  <p className="text-gray-900">{data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : 'Não informado'}</p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Atividade Principal</h3>
                  <p className="text-gray-900">{data.cnae_fiscal_descricao}</p>
                </div>

                {data.qsa && data.qsa.length > 0 && (
                   <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Quadro Societário
                    </h3>
                    <ul className="space-y-2">
                      {data.qsa.slice(0, 3).map((socio, idx) => (
                        <li key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-medium block">{socio.nome_socio}</span>
                          <span className="text-xs text-gray-500">{socio.qualificacao_socio}</span>
                        </li>
                      ))}
                      {data.qsa.length > 3 && <li className="text-xs text-gray-400">+ outros {data.qsa.length - 3} sócios</li>}
                    </ul>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}