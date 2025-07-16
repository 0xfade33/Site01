// Athenaeum JS
const yearSpan=document.getElementById('year');yearSpan.textContent=new Date().getFullYear();

// Seamless code stream animation
const codeLines = [
  'for(int i=0;i<n;i++){',
  '    sum+=array[i];',
  '}',
  'def quicksort(arr):',
  '    if len(arr)<=1:return arr',
  '    return quicksort(l)+[p]+quicksort(r)',
  'λx.(λy.y x) (λz.z)',
  'MOV AX,BX',
  '0x90 0x90 0x90',
  '∫_a^b f(x)dx',
  'Σ (n=1→∞) 1/n² = π²/6',
  'x86 NOP slide: 0x90 0x90 0x90 ...',
  '∫_a^b f(x)dx',
  'while(true){ console.log("rebirth") }',
  'Σ (n=1→∞) 1/n² = π²/6',
  '∫ e^(-x²) dx = √π',
  'Segmentation fault (core remembered)',
  'Gödel ⊢ ¬∀x(P(x) ∨ ¬P(x))',
  'P ⊆ NP ⊆ PSPACE',
  '⟦ λx.x x ⟧ → ⟦ x x ⟧',
  'That gum you like is going to come back in style',
  '∇²φ = 4πGρ',
  'π = lim(n→∞) (4n sin(π/n))',
  '',
  'Σ(1/n!) = e',
  '⌈log₂(n)⌉ steps remaining...',
  'λz.z (λx.xx)(λx.xx)',
  '∃x ∈ ℕ such that x ⊗ x = 1',
  'Heisenberg: Δx·Δp ≥ ℏ/2',
  'Entropy = -Σ p log p',
  'float IEEE754: 0x40490FDB = π',
  '∀x ∈ S, f(f(x)) = x',
  'printf("divine recursion");',
  '🜂 Binary Soul Equation 🜂',
  '≡ Church Numerals Defined ≡',
  'Stack Overflow in Heaven',
  '∂²ψ/∂x² + ∂²ψ/∂y² = -k²ψ',
  'data ≠ wisdom',
  'introspect(“self”); // 💡',
  'Quantum ∑ paths: interference',
  '“A marble algorithm speaks truth.”'
];

document.querySelectorAll('.code-stream').forEach(stream => {
  let html = '<div class="code-roller">';
  // Print enough lines for a tall scroll, then duplicate for seamless loop
  for (let i = 0; i < 30; i++) {
    html += `<div>${codeLines[i % codeLines.length]}</div>`;
  }
  for (let i = 0; i < 30; i++) {
    html += `<div>${codeLines[i % codeLines.length]}</div>`;
  }
  html += '</div>';
  stream.innerHTML = html;
});


// Codex search
document.getElementById('codex-search').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  document.querySelectorAll('#codex-list li').forEach(li=>{
    li.style.display=li.textContent.toLowerCase().includes(q)?'block':'none';
  });
});

// Generative Canvas Demo
(function(){
  const c=document.getElementById('generative1');
  const ctx=c.getContext('2d');
  const r=()=>Math.random()*c.width;
  ctx.strokeStyle='#ff0077';
  ctx.lineWidth=0.5;
  for(let i=0;i<120;i++){
    ctx.beginPath();
    ctx.arc(r(),r(),r()/6,0,2*Math.PI);
    ctx.stroke();
  }
})();

// Black Hole button navigation
const bhBtn = document.getElementById('black-hole-btn');
if (bhBtn) {
  bhBtn.addEventListener('click', () => {
    window.location.href = 'blackhole.html';
  });
}
