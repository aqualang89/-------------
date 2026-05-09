export function useScrollReveal() {
  if (process.client) {
    onMounted(() => {
      const selectors = [
        '[data-reveal]',
        '[data-reveal-left]',
        '[data-reveal-right]',
        '[data-reveal-up]',
        '[data-reveal-child]'
      ]

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      )

      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          observer.observe(el)
        })
      })
    })
  }
}
