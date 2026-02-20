import SuperJSON from 'superjson';

const data = {
  email: 'admin@vendas.com',
  password: 'Admin@123456'
};

const serialized = SuperJSON.stringify(data);
console.log('Testing login...');

const response = await fetch('http://localhost:3000/api/trpc/auth.login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: serialized,
});

const result = await response.json();
console.log('Status:', response.status);
console.log('Cookies:', response.headers.get('set-cookie'));
console.log('Response:', JSON.stringify(result, null, 2).substring(0, 200));

if (result.result?.data?.json?.success) {
  console.log('\n✅ LOGIN SUCCESSFUL!');
} else {
  console.log('\n❌ LOGIN FAILED');
}
