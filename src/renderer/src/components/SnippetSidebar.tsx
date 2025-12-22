import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail
} from '@/components/ui/sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { SettingsSheet } from '@/components/SettingsSheet'
import { SidebarFilterSection } from './SidebarFilterSection'
import { SidebarTagSection } from './SidebarTagSection'

export function SnippetSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3.5 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <SidebarTrigger className="-ml-1" />
            <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              Fragment
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarFilterSection />
        <SidebarTagSection />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
          <SettingsSheet />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
