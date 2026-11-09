// Odada "Neşelendir → Müzik aç" ile çalan şarkı.
// 1. Şarkı dosyasını images/muzik/ klasörüne koy (mp3, m4a, ogg ya da wav; adı aşağıdaki `file` ile aynı olsun).
// 2. npm run dev / build, şarkının start'tan başlayan length saniyelik kısmını keser,
//    başına ve sonuna yumuşak geçiş ekler → src/assets/music/<file>.mp3 (oyun hafif kalsın diye).
// Dosya yoksa oyunun kendi küçük müzik kutusu melodisi çalar.
export const song = {
  file: 'cingenem',
  title: 'Ebru Gündeş – Çingenem',
  /** şarkının kaçıncı saniyesinden başlansın */
  start: 35,
  /** kaç saniyelik kısım kullanılsın (çalarken başa sarar) */
  length: 60,
};
