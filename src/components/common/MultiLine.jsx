function MultiLine({ text, empty = "Not added" }) {
    if (!text) {
        return <span className="text-muted">{empty}</span>
    }
    return (
        <>
            {text.split("\n").map((line, index) => (
                <span key={index}>{line}<br /></span>
            ))}
        </>
    )
}

export default MultiLine