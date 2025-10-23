-- Create contact_groups table
CREATE TABLE contact_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_group_members join table
CREATE TABLE contact_group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, contact_id)
);

-- Create indexes for performance
CREATE INDEX idx_contact_groups_name ON contact_groups(name);
CREATE INDEX idx_contact_group_members_group_id ON contact_group_members(group_id);
CREATE INDEX idx_contact_group_members_contact_id ON contact_group_members(contact_id);

-- Enable Row Level Security
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_groups
CREATE POLICY "Users can view all groups" ON contact_groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert groups" ON contact_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update groups" ON contact_groups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete groups" ON contact_groups FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for contact_group_members
CREATE POLICY "Users can view all group members" ON contact_group_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can add group members" ON contact_group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can remove group members" ON contact_group_members FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for updated_at on contact_groups
CREATE TRIGGER update_contact_groups_updated_at 
  BEFORE UPDATE ON contact_groups 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
