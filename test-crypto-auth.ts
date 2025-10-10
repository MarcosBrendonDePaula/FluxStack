/**
 * Script de teste para validar autenticação criptográfica
 */

import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

async function testCryptoAuth() {
  console.log('🔐 Testando Autenticação Criptográfica Ed25519\n')

  // 1. Gerar par de chaves
  console.log('1️⃣ Gerando par de chaves Ed25519...')
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKeyBytes = ed25519.getPublicKey(privateKey)
  const publicKey = bytesToHex(publicKeyBytes)
  const privateKeyHex = bytesToHex(privateKey)

  console.log(`   ✅ Chave pública: ${publicKey.substring(0, 16)}...`)
  console.log(`   ✅ Chave privada: ${privateKeyHex.substring(0, 16)}... (NUNCA enviar ao servidor!)\n`)

  // 2. Preparar requisição
  console.log('2️⃣ Preparando requisição assinada...')
  const url = '/api/crypto-auth/protected'
  const method = 'GET'
  const timestamp = Date.now()
  const nonce = generateNonce()

  // 3. Construir mensagem para assinar
  const message = `${method}:${url}`
  const fullMessage = `${publicKey}:${timestamp}:${nonce}:${message}`

  console.log(`   📝 Mensagem: ${fullMessage.substring(0, 50)}...\n`)

  // 4. Assinar mensagem
  console.log('3️⃣ Assinando mensagem com chave privada...')
  const messageHash = sha256(new TextEncoder().encode(fullMessage))
  const signatureBytes = ed25519.sign(messageHash, privateKey)
  const signature = bytesToHex(signatureBytes)

  console.log(`   ✅ Assinatura: ${signature.substring(0, 32)}...\n`)

  // 5. Fazer requisição ao servidor
  console.log('4️⃣ Enviando requisição ao servidor...')
  const response = await fetch('http://localhost:3000/api/crypto-auth/protected', {
    method: 'GET',
    headers: {
      'x-public-key': publicKey,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
      'x-signature': signature
    }
  })

  const data = await response.json()

  console.log(`   📡 Status: ${response.status}`)
  console.log(`   📦 Resposta:`, JSON.stringify(data, null, 2))

  if (data.success) {
    console.log('\n✅ SUCESSO! Assinatura validada corretamente pelo servidor!')
    console.log(`   👤 Dados protegidos recebidos: ${data.data?.secretInfo}`)
  } else {
    console.log('\n❌ ERRO! Assinatura rejeitada pelo servidor')
    console.log(`   ⚠️  Erro: ${data.error}`)
  }

  // 6. Testar replay attack (reutilizar mesma assinatura)
  console.log('\n5️⃣ Testando proteção contra replay attack...')
  const replayResponse = await fetch('http://localhost:3000/api/crypto-auth/protected', {
    method: 'GET',
    headers: {
      'x-public-key': publicKey,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce, // Mesmo nonce
      'x-signature': signature // Mesma assinatura
    }
  })

  const replayData = await replayResponse.json()

  console.log(`   📡 Replay Status: ${replayResponse.status}`)
  console.log(`   📦 Replay Response:`, JSON.stringify(replayData, null, 2))

  if (!replayData.success && replayData.error?.includes('nonce')) {
    console.log('   ✅ Proteção funcionando! Replay attack bloqueado.')
  } else if (replayResponse.status === 401) {
    console.log('   ✅ Proteção funcionando! Replay attack bloqueado (status 401).')
  } else {
    console.log('   ⚠️  ATENÇÃO: Replay attack NÃO foi bloqueado!')
  }
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

// Executar teste
testCryptoAuth().catch(console.error)
