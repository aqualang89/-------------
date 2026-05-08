export function useScrollReveal() {
  if (process.client) {
    onMounted(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      )

      document.querySelectorAll('[data-reveal]').forEach((el) => {
        observer.observe(el)
      })
    })
  }
}
