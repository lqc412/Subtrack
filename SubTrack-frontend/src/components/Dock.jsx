export default function FloatingActionButton({onOpen}) {
    return (
      <div className="fixed bottom-6 right-6">
        <button className="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center" onClick={onOpen}>
          <svg className="size-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </g>
          </svg>
        </button>
      </div>
    )
  }