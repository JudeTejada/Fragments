import { LucideIcon } from 'lucide-react'
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarMenuItemComponentProps {
  icon: LucideIcon
  label: string
  count?: number
  isActive?: boolean
  badgeTestId?: string
  iconClassName?: string
  onClick?: () => void
}

export function SidebarMenuItemComponent({
  icon: Icon,
  label,
  count,
  isActive,
  badgeTestId = 'trash-count',
  iconClassName,
  onClick
}: SidebarMenuItemComponentProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
        isActive={isActive}
        onClick={onClick}
        tooltip={label}
        className="transition-all duration-200 ease-out"
      >
        <Icon className={cn('size-4 shrink-0 transition-transform duration-200', iconClassName)} />
        <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
          {label}
        </span>
        {count !== undefined && (
          <SidebarMenuBadge
            data-testid={badgeTestId}
            className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
          >
            {count}
          </SidebarMenuBadge>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
