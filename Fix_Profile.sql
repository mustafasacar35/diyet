-- Kullanıcının profilinin var olduğundan ve Admin yetkisine sahip olduğundan emin olalım
-- E-posta adresinizi aşağıya yazın
INSERT INTO public.profiles (id, role, full_name, avatar_url)
SELECT 
    id, 
    'admin', -- Rolü admin olarak zorluyoruz
    'Mustafa Sacar', -- İstediğiniz isim
    ''
FROM auth.users
WHERE email = 'mustafasacar@hotmail.com' -- E-postanız
ON CONFLICT (id) DO UPDATE 
SET role = 'admin'; -- Zaten varsa rolü admin yap
