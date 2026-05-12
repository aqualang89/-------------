import sys

with open('pages/index.vue', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''.sh-hcard {
  flex-shrink: 0;
  width: 78vw;
  max-width: 380px;
  height: 88dvh;
  min-height: 540px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(241, 230, 200, 0.08);
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
}
.sh-hcard-img {
  width: 100%;
  flex: 0 0 58%;
  position: relative;
  overflow: hidden;
}
.sh-hcard-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  display: block;
  transition: transform 0.5s ease;
}
.sh-hcard:hover .sh-hcard-img img {
  transform: scale(1.07);
}
.sh-hcard-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 24px;
  justify-content: flex-start;
}
.sh-hcard-num {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.25em;
}
.sh-hcard-title {
  font-family: var(--font-serif);
  font-size: clamp(24px, 4.5vw, 34px);
  font-weight: 400;
  color: var(--cream);
  line-height: 1.15;
  margin: 0;
}
.sh-hcard-desc {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.55;
  color: var(--cream-dim);
  max-width: 100%;
  margin: 0;
}
.sh-hcard-link {
  display: inline-block;
  margin-top: auto;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-hcard-link:hover {
  color: var(--cream);
}

@media (min-width: 768px) {
  .sh-horizontal-track {
    gap: 32px;
    padding: 0 10vw;
  }
  .sh-hcard {
    width: 54vw;
    max-width: 500px;
    height: 88dvh;
    min-height: 620px;
  }
  .sh-hcard-title {
    font-size: clamp(30px, 4vw, 40px);
  }
}

@media (min-width: 1024px) {
  .sh-horizontal-track {
    gap: 48px;
    padding: 0 5vw;
  }
  .sh-hcard {
    width: 38vw;
    max-width: 560px;
    height: 88vh;
    min-height: 680px;
  }
  .sh-hcard-text {
    padding: 24px 32px 32px;
  }
  .sh-hcard-title {
    font-size: clamp(34px, 3vw, 44px);
  }
  .sh-hcard-img {
    flex: 0 0 60%;
  }
}'''

new_block = '''.sh-hcard {
  flex-shrink: 0;
  width: 78vw;
  max-width: 380px;
  height: 88dvh;
  min-height: 540px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 12px;
  overflow: hidden;
  background: #0e1a24;
}
.sh-hcard-img {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.sh-hcard-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sh-hcard::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.88) 0%,
    rgba(0, 0, 0, 0.55) 30%,
    rgba(0, 0, 0, 0.15) 55%,
    transparent 75%
  );
  z-index: 1;
  pointer-events: none;
}
.sh-hcard-text {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
}
.sh-hcard-num {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.3em;
}
.sh-hcard-title {
  font-family: var(--font-serif);
  font-size: clamp(28px, 5vw, 38px);
  font-weight: 400;
  color: var(--cream);
  line-height: 1.1;
  margin: 0;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
.sh-hcard-desc {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(241, 230, 200, 0.85);
  margin: 0;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
}
.sh-hcard-link {
  display: inline-block;
  margin-top: 6px;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  text-decoration: none;
  transition: color 0.3s ease, transform 0.3s ease;
}
.sh-hcard-link:hover {
  color: var(--cream);
}

@media (min-width: 768px) {
  .sh-horizontal-track {
    gap: 32px;
    padding: 0 10vw;
  }
  .sh-hcard {
    width: 54vw;
    max-width: 500px;
    min-height: 620px;
  }
  .sh-hcard-text {
    padding: 28px;
  }
  .sh-hcard-title {
    font-size: clamp(32px, 4vw, 44px);
  }
}

@media (min-width: 1024px) {
  .sh-horizontal-track {
    gap: 48px;
    padding: 0 5vw;
  }
  .sh-hcard {
    width: 38vw;
    max-width: 560px;
    height: 88vh;
    min-height: 680px;
  }
  .sh-hcard-text {
    padding: 32px 36px 36px;
  }
  .sh-hcard-title {
    font-size: clamp(36px, 3.2vw, 48px);
  }
}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('pages/index.vue', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Old block not found')
    sys.exit(1)
