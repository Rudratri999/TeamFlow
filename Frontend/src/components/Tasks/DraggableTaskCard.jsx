import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import TaskCard from './TaskCard'

// Wraps TaskCard with drag behavior. Only the grip handle starts a drag,
// so the buttons, links and selects inside the card keep working normally.
const DraggableTaskCard = ({ canMove, isMoving, onMove, ...cardProps }) => {
    const { task } = cardProps

    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        isDragging
    } = useDraggable({
        id: task.id,
        disabled: !canMove || isMoving
    })

    const handle = canMove ? (
        <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Move ${task.title}`}
            title="Drag to move"
            className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        >
            <GripVertical size={16} aria-hidden="true" />
        </button>
    ) : null

    return (
        <div ref={setNodeRef} className={isDragging ? 'opacity-40' : undefined}>
            <TaskCard
                {...cardProps}
                dragHandle={handle}
                isMoving={isMoving}
                onMove={canMove ? onMove : undefined}
            />
        </div>
    )
}

export default DraggableTaskCard