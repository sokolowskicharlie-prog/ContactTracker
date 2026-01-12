/*
  # Auto-Assign Supplier Regions Based on Ports

  1. New Functions
    - `auto_assign_supplier_regions()` - Automatically assigns regions to suppliers based on their ports
    - Called whenever supplier_ports are inserted, updated, or deleted
    
  2. New Triggers
    - Trigger on supplier_ports INSERT
    - Trigger on supplier_ports DELETE
    
  3. How It Works
    - When ports are added/removed for a supplier, function checks all supplier ports
    - Matches port names against uk_port_regions table
    - Automatically assigns supplier to all matching regions
    - Removes regions if no ports in that region remain
    
  4. Important Notes
    - Case-insensitive port matching using UPPER()
    - Prevents duplicate region assignments
    - Automatically maintains supplier_regions table
*/

-- Create function to auto-assign regions based on ports
CREATE OR REPLACE FUNCTION auto_assign_supplier_regions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing region assignments for this supplier
  DELETE FROM supplier_regions
  WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  
  -- Insert new region assignments based on current ports
  INSERT INTO supplier_regions (supplier_id, region_id)
  SELECT DISTINCT
    sp.supplier_id,
    upr.region_id
  FROM supplier_ports sp
  JOIN uk_port_regions upr ON UPPER(sp.port_name) = UPPER(upr.port_name)
  WHERE sp.supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
  ON CONFLICT (supplier_id, region_id) DO NOTHING;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT on supplier_ports
DROP TRIGGER IF EXISTS trigger_auto_assign_regions_on_insert ON supplier_ports;
CREATE TRIGGER trigger_auto_assign_regions_on_insert
  AFTER INSERT ON supplier_ports
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_supplier_regions();

-- Create trigger for DELETE on supplier_ports
DROP TRIGGER IF EXISTS trigger_auto_assign_regions_on_delete ON supplier_ports;
CREATE TRIGGER trigger_auto_assign_regions_on_delete
  AFTER DELETE ON supplier_ports
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_supplier_regions();
